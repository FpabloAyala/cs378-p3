import './App.css';
import React, {Component} from 'react';

async function fetchGeoData(item){
  const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search?name=';
  const url = GEO_URL + item + '&count=1';

  try{
    const response = await fetch(url);
    const json = await response.json();
    if(json.results.length > 0){
      const lat = json.results[0].latitude
      const lon = json.results[0].longitude
      return fetchWeatherData(lat, lon);
    }
  }
  catch(err){
    alert("Something went wrong finding the city");
  }
  
}

async function fetchWeatherData(lat, lon){
  const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast?';
  const latq = 'latitude=' + lat;
  const lonq = '&longitude=' + lon;
  const tempq = '&hourly=temperature_2m&temperature_unit=fahrenheit';
  const url = WEATHER_URL + latq + lonq + tempq;
  try{
    const response = await fetch(url);
    const json = await response.json();
    return json;
  }
  catch(err){
    alert("Something went wrong getting temperature data");
  }
}


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      Citylist:["Austin", "Dallas", "Houston"],
      currActive: "Austin",
      Timelist:[],
      Templist:[],
    };
  }

  onChangeValue = event => {
    this.setState({value: event.target.value});
  }

  onAddButton = () => {
    this.setState(state => {
      const Citylist = [...state.Citylist, state.value];
      return {
        Citylist,
        value: ''
      };
    });
  };

  onCityClick = event => {
    this.setState({currActive: event.target.id})
    fetchGeoData(event.target.id).then(json =>{
      this.onFetch(json);
    });
  }

  onFetch = (json) => {
    this.setState(state => {
      let Timelist = [];
      for(let i = 0; i < 11; i++){
        Timelist.push("" + (i+1) + ':00PM');
      }
      Timelist.push("12:00AM")
      const Templist = json.hourly.temperature_2m.slice(13, 25);
      return{
        Timelist,
        Templist
      };
    });
  };

  makeButton = (item) =>{
    if(this.state.currActive === item){
      fetchGeoData(item).then(json =>{
        this.onFetch(json);
      });
      
      
      return <button className='active-city-button' id={item} onClick={this.onCityClick}>{item}</button>
    }
    else{
      return <button className='city-button' id={item} onClick={this.onCityClick}>{item}</button>
    }
    
  }

  

  render (){
    return(
      <>

      <div className='overall'>

        <div className='button-section'>
          {this.state.Citylist.map(item => (
            this.makeButton(item)
          ))}
        </div>

        <div className='add-section'>
          <input className='city-input' type={"text"} 
            value={this.state.value}
            onChange={this.onChangeValue} 
            placeholder='Enter city name'/>

          <button className='add-button' onClick={this.onAddButton}>+</button>
        </div>
        
        <div className='temp-text'>
            <span>Time</span>
            <span>Temperature</span>
        </div>

        <div className='time-temp-con'>
            <div className='time-col'>
              {this.state.Timelist.map(item => (
                <p className='time-temp-data'>{item}</p>
              ))}
            </div>
            <div className='temp-col'>
              {this.state.Templist.map(item => (
                <p className='time-temp-data'>{item + "°F"}</p>
              ))}
            </div>
        </div>

      </div>
    
      </>
    );
  }
}


export default App;

