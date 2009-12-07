require 'rubygems'
require 'json'
require 'rufus/tokyo/tyrant'

# stops in {station_id => [lat, lon]} form
BusStops = JSON.load(File.read("bus_stops.json"))

BusTimes = Rufus::Tokyo::TyrantTable.new('localhost', 4321)

