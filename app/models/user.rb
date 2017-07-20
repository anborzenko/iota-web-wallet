class User < ApplicationRecord
  devise :database_authenticatable, :authentication_keys => [:username]
  devise :registerable, :trackable, :validatable, :timeoutable

  has_one_time_password
  has_one :wallet
  has_many :user_change_logs

  validates :username, presence: true, uniqueness: true
  validates :wallet, presence: true
  validates :password_hash, presence: true

  def email_required?
    false
  end

  def email_changed?
    false
  end
end
