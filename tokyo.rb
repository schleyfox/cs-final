require 'rubygems'
require 'rufus/tokyo/tyrant'

Rufus::Tokyo::Tyrant

BusStops = Rufus::Tokyo::TyrantTable.new('localhost', 4321)

