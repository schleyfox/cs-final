#Overview: This is a wrapper around Tokyo Cabinet, a light, fast
#          and efficient datastore.
require 'rubygems'
require 'json'
require 'rufus/tokyo/tyrant'

# stops in {station_id => [lat, lon]} form
# loads in BusStops from the json file
BusStops = JSON.load(File.read("bus_stops.json"))

#Sets up the BusTimes table
BusTimes = Rufus::Tokyo::TyrantTable.new('localhost', 4321)

