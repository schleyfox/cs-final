require 'rubygems'
require 'rufus/tokyo/tyrant'

# stops in {station_id => [lat, lon]} form
BusStops = {16819 => []}

BusTimes = Rufus::Tokyo::TyrantTable.new('localhost', 4321)

