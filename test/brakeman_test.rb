require 'brakeman'

class BrakemanTest < ActiveSupport::TestCase
  test "Brakeman finds no warnings or errors" do
    tracker = Brakeman.run "./"
    puts tracker.report

    assert tracker.checks.warnings.empty?
    assert tracker.errors.empty?
  end
end