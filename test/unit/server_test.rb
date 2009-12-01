require File.join(File.dirname(__FILE__), '..', 'test_helper')

class ServerTest < Test::Unit::TestCase
  context "on GET to /" do
    should "have a google map"
    should "have two text fields for directions"
  end

  context "on GET to /bus_times.json" do
    should "be valid JSON"
    should "contain entries for each stop with each stop containing entries for each route"
  end
end
