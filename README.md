# IOTA web wallet

A web wallet for the blockless distributed ledger IOTA. See iotatoken.com for more information about the project.

The wallet runs on top of Ruby on Rails.

## Prerequisites:
1) Ruby 3.2
2) Rails 5.1.1

Other versions may work, but have not been tested.

## Instructions
Execute the following commands to setup and run the wallet
```
bundle
rake db:migrate 
rails s

```

## macOS Instructions (requires Homebrew)
Copied from https://gorails.com/setup/osx/10.12-sierra
1) Install Ruby (rbenv and ruby-build)
```
brew install rbenv ruby-build
# Add rbenv to bash so that it loads every time you open a terminal
echo 'if which rbenv > /dev/null; then eval "$(rbenv init -)"; fi' >> ~/.bash_profile
source ~/.bash_profile
# Install Ruby
rbenv install 2.4.0
rbenv global 2.4.0
ruby -v
```
Ensure that the correct version of Ruby is being used

2) Install Rails
```
gem install rails -v 5.0.1
rbenv rehash
rails -v
```
Ensure that the correct version of Rails is being used

3) Install MySQL
```
brew install mysql
# To have launchd start mysql at login:
ln -sfv /usr/local/opt/mysql/*plist ~/Library/LaunchAgents

# Then to load mysql now:
launchctl load ~/Library/LaunchAgents/homebrew.mxcl.mysql.plist
```


