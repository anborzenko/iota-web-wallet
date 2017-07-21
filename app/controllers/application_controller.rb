class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  rescue_from Authie::Session::InactiveSession, :with => :auth_session_error
  rescue_from Authie::Session::ExpiredSession, :with => :auth_session_error
  rescue_from Authie::Session::BrowserMismatch, :with => :auth_session_error

  private

  def auth_session_error
    redirect_to users_login_path
  end
end
