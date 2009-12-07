#Overview: Screen scrapes data from the UTS website for bus times. Called by
#          cron.

#tokyo is the wrapper to TokyoCabinet, which is a light, fast, and efficient
#      datastore
require 'tokyo'
#hpricot is the library for HTML parsing
require 'hpricot'
require 'json'
require 'open-uri'

BusStops.keys.each do |stop|
  doc = Hpricot(open("http://avlweb.charlottesville.org/RTT/Public/RoutePositionET.aspx?PlatformNo=#{stop}"))

  times = {}
  (doc/'table.tableET tr')[2..-1].each do |row|
    cols = (row/:td)
    times[cols[1].innerHTML] ||= []
    times[cols[1].innerHTML] << cols[3].innerHTML.to_i*60
  end

  times.each do |route, timelist|
    times[route] = timelist.to_json
  end

  BusTimes[stop.to_s] = times.merge('fetched_at' => Time.now.to_i)
end



