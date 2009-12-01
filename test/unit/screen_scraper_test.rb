require File.join(File.dirname(__FILE__), '..', 'test_helper')

class ScreenScraperTest < Test::Unit::TestCase
  
  context "on run" do
    context "given a list of bus stop and routes" do
      should "store time until the next bus from each route for each stop in seconds"
      should "store in unix time the time when the data was fetched"

      context "when an error occurs" do
        should "retry once"

        context "repeatedly" do
          should "record nil for the time"
        end
      end
    end
  end
end

