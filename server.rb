require 'tokyo'
require 'sinatra'
require 'json'

get '/' do
  #render woody's html
  "hello"
end

get '/bus_times.json' do
  BusTimes.to_a.inject({}) do |h, stop|
    h[stop[0]] = stop[1]
  end.merge('fetched_at' => Time.now.to_i).to_json
end
  
