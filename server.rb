require 'tokyo'
require 'sinatra'
require 'json'

get '/' do
  #render woody's html
  "hello"
end

get '/bus_times.json' do
  BusTimes.to_a.inject({}) do |h, stop|
    stop[1].each {|k,v| stop[1][k] = v.to_i }
    h[stop[0]] = stop[1]
  end.to_json
end
  
