require 'rubygems'
require 'open-uri'
require 'hpricot'
require 'json'

doc = Hpricot(open("http://www.virginia.edu/parking/uts/GPS/locator.html"))

graph = {}
((doc/'td#content > table')[3]/:tr)[1..-1].each do |row|
  cols = (row/:td)
  stop_id = ((cols[1]/:div)/:a).innerHTML
  routes = (cols[3]/:img).map{|i| i['alt'] }
  graph[stop_id] = routes
end
puts graph.to_json
