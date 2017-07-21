class UsersController < ApplicationController

  def seed_login
    # Used for UI related stuff
    session[:isLoggedIn] = true
  end

  def login
    if params.key?(:username)
      @user = User.find_by_username(params[:username])
      if @user.nil?
        return render json: { success: false, message: 'Username not found' }
      end

      return unless authenticate_login_credentials(@user)
      return unless authenticate_2fa(@user)

      self.current_user = @user

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
      self.current_user = @user

      if @user.has2fa
        render json: { success: true,
                       qr: get_qr(@user).as_svg(offset: 0, color: '000', shape_rendering: 'crispEdges', module_size: 5)}
      else
        render json: { success: true }
      end
    else
      render json: { success: false, message: @user.errors.full_messages.to_sentence }
    end
  end

  def confirm2fa
    @user = User.find_by_username(params[:username]) if @user.nil?
    return unless authenticate_login_credentials(@user)

    if @user.authenticate_otp(params[:otp_key])
      @user.has_confirmed_2fa = true

      render json: { success: @user.save,
                     encrypted_seed: @user.wallet.encrypted_seed,
                     message: @user.errors.full_messages.to_sentence }

      self.current_user = @user unless @user.errors.any?
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
    return unless authenticate_user(current_user)

    attribs = params.permit(:username, :has2fa, :has_confirmed_2fa)

    attribs.each do |key, value|
      current_user.user_change_logs.create(old_value: current_user[key], new_value: value, column_name: key)
    end

    if current_user.update(attribs)
      render json: { success: true }
    else
      render json: { success: false, message: @user.errors.full_messages.to_sentence }
    end
  end

  def logout
    if logged_in?
      # Will be false if the user is using a seed only.
      auth_session.invalidate!
    end
    reset_session
  end

  private

  def authenticate_login_credentials(user)
    if user.authenticate(params[:password])
      true
    else
      render json: { success: false, message: 'Invalid password' }
      false
    end
  end

  def authenticate_user(user)
    authenticate_session && authenticate_2fa(user)
  end

  def authenticate_session
    if logged_in?
      true
    else
      render json: { success: false, message: 'Invalid session' }
      false
    end
  end

  def create_user(user_params)
    @user = User.new(username: user_params[:username], has2fa: user_params[:has2fa], password: user_params[:password])

    if @user.errors.none?
      @user.create_wallet(encrypted_seed: user_params[:encrypted_seed])
      @user.wallet.save!
      @user.save
    else
      false
    end
  end

  def get_qr(user)
    RQRCode::QRCode.new(user.provisioning_uri(user.username, issuer: 'IOTAWallet'),size: 10, level: :h)
  end

  def authenticate_2fa(user)
    return true unless user.has2fa

    unless user.has_confirmed_2fa
      render json: { success: false, require_2fa_confirmation: true,
                            qr: get_qr(user).as_svg(offset: 0, color: '000', shape_rendering: 'crispEdges', module_size: 5) }
      return false
    end

    return true if params[:otp_key] && user.authenticate_otp(params[:otp_key])

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
