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

  def login_without_proof
    # See authenticate_login_credentials() for some background

    @user = User.find_by_username(params[:username])
    if @user.nil?
      return render json: { success: false, message: 'Username not found' }
    end

    if @user.password_hash.nil?
      # Only allow users that have refused to do the proof.
      # For everyone else it is safer to require the password as well
      session[:isLoggedIn] = true
      render json: { success: true, encrypted_seed: @user.wallet.encrypted_seed }
    else
      render json: { success: false, message: 'No access' }
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
    if @user.password_hash != params[:password_hash]
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

  def delete
    return unless authenticate_user

    deleted_user = DeletedUser.new(username: @user.username, password_hash: @user.password_hash, wallet: @user.wallet)
    unless deleted_user.save
      return render json: { success: false, message: deleted_user.errors.full_messages.to_sentence }
    end

    if @user.destroy
      render json: { success: true }
    else
      render json: { success: false, message: @user.errors.full_messages.to_sentence }
    end
  end

  def logout
    reset_session
  end

  private

  def authenticate_user
    authenticate_session && authenticate_2fa
  end

  def create_user(user_params)
    @user = User.new(username: user_params[:username],
                            has2fa: user_params[:has2fa],
                            password_hash: user_params[:password_hash])

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

  def authenticate_login_credentials
=begin
    This method contains a lot of legacy patching. The server did not store
    the hashed password from the beginning, so if we don't have it, we need
    to request the real password from the user and use it to decrypt the seed.
    This has to be done server side to ensure that the identity is real. The
    seed or the password is of course never stored during this process,
    and is discarded immediately after the identity has been proved.
    Users that do have provided the password hash never need to provide the
    password again, it's only a one time job to ensure that we know the
    identity of the user
=end

    unless params.key?('password_hash')
      render json: { success: false, message: 'Failed to provide password hash' }
      return false
    end

    if @user.password_hash.nil? && !params.key?('password')
      render json: { success: false, require_first_time_proof: true }
      return false
    end

    if !@user.password_hash.nil? && @user.password_hash == params[:password_hash]
      true
    elsif @user.password_hash.nil? && is_valid_password?(params[:password], @user.wallet.encrypted_seed)
      # Save the hashed password for later so we don't need to do this again
      @user.password_hash = params[:password_hash]
      @user.save
      true
    else
      render json: { success: false, message: 'Wrong password' }
      false
    end
  end

  def authenticate_session
    @user = User.find_by_username(session[:username]) if @user.nil?

    if !@user.nil? && @user.password_hash == session[:password_hash] && @user.username == session[:username] &&
        (!@user.has2fa || (@user.has2fa && @user.has_confirmed_2fa))
      true
    else
      redirect_to users_login_path
      false
    end
  end

  def save_session(parameters)
    session[:isLoggedIn] = true

    [:username, :password_hash].each do |key|
      session[key] = parameters[key] if parameters.key?(key)
    end
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

  def is_valid_password?(pass, enc_seed)
=begin
    First of all: I'm really sorry about this code. There is really no excuse
    for doing this, but let me try to explain:
    The idea is simple. Validate the user identity by testing if the password
    is able to decrypt the seed or not. This really backfired when I tried
    to decrypt a sjcl ciphertext in ruby. Apparently no ruby library known
    to man are able to handle the ciphertexts from sjcl, even if they say they
    are.

    So I give you the ugliest hack imaginable: Inject the sjcl lib into ruby
    and execute it using ExecJS. Enjoy
=end

    source = File.open(File.join(File.dirname(__FILE__), '../assets/javascripts/vendor/sjcl.js')).read
    context = ExecJS.compile(source)

    begin
      !context.call("sjcl.decrypt", pass, enc_seed, bare: true).nil?
    rescue
      false
    end
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
