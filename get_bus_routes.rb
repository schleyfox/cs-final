#Overview: Gets data from the website and stores it into a json file
require 'rubygems'
require 'open-uri'
#hpricot is a library for HTML parsing
require 'hpricot'
require 'json'

#Set the route names into a hash
routes = {'northline' => 'NL', 'cgs' => 'CGS', 'colonnade' => 'CS', 'green' => 'G', 'innerloop' => 'UL', 'shs' => 'SHS'}
graph = {}

routes.keys.each do |route|
begin
  doc = Hpricot(open("http://www.virginia.edu/parking/uts/routes/#{route}.html"))
  
  ((doc/'td#content table')[1]/:tr)[1..-1].each do |row|
    cols = (row/:td)
    stop_id = ((cols[1]/:div)/:a).innerHTML

    graph[routes[route]] ||= []
    graph[routes[route]] << stop_id.to_i unless stop_id.to_i == 0
  end
rescue
  puts route
end
end
graph.each{|k,v| puts v.size }
puts graph.to_json
