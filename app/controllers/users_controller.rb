class UsersController < ApplicationController

  def seed_login
    save_session(params)
  end

  def login
    if params.key?(:username)
      @user = User.find_by_username(params[:username])
      if @user.nil?
        return render json: { success: false, message: 'Username not found' }
      end

      return unless authenticate_login_credentials
      return unless authenticate_2fa

      save_session(params)

      render json: { success: true, encrypted_seed: @user.wallet.encrypted_seed }
    else
      @user = User.new
    end
  end

  def signup
    @user = User.find_by_username(params[:username])
    unless @user.nil?
      return render json: { success: false, message: 'Username is taken' }
    end

    params[:has2fa] = params[:has2fa] == 'true'

    if create_user(params)
      save_session(params)

      if @user.has2fa
        render json: { success: true,
                       qr: get_qr.as_svg(offset: 0, color: '000', shape_rendering: 'crispEdges', module_size: 5)}
      else
        render json: { success: true }
      end
    else
      render json: { success: false, message: @user.errors.full_messages.to_sentence }
    end
  end

  def confirm2fa
    return unless validate_required_params(['otp_key', 'username', 'password_hash'])

    @user = User.find_by_username(params[:username]) if @user.nil?
    if @user.password != params[:password_hash]
      return render json: {success: false, message: 'Invalid password'}
    end

    if @user.authenticate_otp(params[:otp_key])
      @user.has_confirmed_2fa = true

      render json: { success: @user.save,
                     encrypted_seed: @user.wallet.encrypted_seed,
                     message: @user.errors.full_messages.to_sentence }

      save_session(params) unless @user.errors.any?
    else
      render json: { success: false, message: 'Invalid key. Try again' }
    end
  end

  def exists
    user = User.find_by_username(params[:username])
    render json: { exists: !user.nil? }
  end

  def show
    authenticate_session
  end

  def update
    return unless authenticate_user

    attribs = params.permit(:username, :has2fa, :has_confirmed_2fa)

    attribs.each do |key, value|
      @user.user_change_logs.create(old_value: @user[key], new_value: value, column_name: key)
      session[key] = value if session.key?(key)
    end

    if @user.update(attribs)
      save_session(attribs)
      render json: { success: true }
    else
      render json: { success: false, message: @user.errors.full_messages.to_sentence }
    end
  end

  def logout
    reset_session
  end

  private

  def create_user(user_params)
    @user = User.new(username: user_params[:username],
                            has2fa: user_params[:has2fa])
    @user.password = user_params[:password_hash]

    if @user.errors.none?
      @user.create_wallet(encrypted_seed: user_params[:encrypted_seed])
      @user.wallet.save!
      @user.save
    else
      false
    end
  end

  def get_qr
    RQRCode::QRCode.new(@user.provisioning_uri(@user.username, issuer: 'IOTAWallet'),size: 10, level: :h)
  end

  def authenticate_2fa
    @user = User.find_by_username(session[:username]) if @user.nil?

    return true unless @user.has2fa

    unless @user.has_confirmed_2fa
      render json: { success: false, require_2fa_confirmation: true,
                            qr: get_qr.as_svg(offset: 0, color: '000', shape_rendering: 'crispEdges', module_size: 5) }
      return false
    end

    return true if params[:otp_key] && @user.authenticate_otp(params[:otp_key])

    render json: { success: false, require_2fa: true }
    false
  end

  def validate_required_params(keys)
    keys.each do |key|
      unless params.key?(key)
        render json: { success: false, message: 'Missing ' + key }
        return false
      end
    end

    true
  end
end
