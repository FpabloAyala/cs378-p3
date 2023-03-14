import './App.css';
import React, {Component} from 'react';
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
import { getAuth, signInWithEmailAndPassword, signOut} from "firebase/auth";
import { getDatabase, ref, get, set } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCF7ejewlNetzs2KvU85k4rDqs7mHcZEWk",
  authDomain: "p4-weatherapp.firebaseapp.com",
  databaseURL: "https://p4-weatherapp-default-rtdb.firebaseio.com",
  projectId: "p4-weatherapp",
  storageBucket: "p4-weatherapp.appspot.com",
  messagingSenderId: "969287953248",
  appId: "1:969287953248:web:6328795dc7d9248dea4c05",
  measurementId: "G-CDGS8ZHQPM"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
//const ref = db.ref('server/user-data')
//const analytics = getAnalytics(app);


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

async function emailLogin(user, pass){
  try {
    const user2Email = user + "@weatherapp.com"
    const authUser = await signInWithEmailAndPassword(auth, user2Email, pass);
    return authUser;
  } 
  catch (err) {
    alert(err.message);
  }
}

async function saveCity(cityList, userName){
  const userData = {
    savedCities : cityList
  };
  set(ref(db, "users/" + userName), {
    userData
  });
}

async function getCities(userName){
  let retrievedCities;
  await get(ref(db, "users/" + userName)).then((snapshot) => {
    if (snapshot.exists()) {
      retrievedCities = snapshot.val().userData.savedCities;
    } else {
      console.log("no data found");
      retrievedCities = ["Austin", "Dallas", "Houston"];
    }
  }).catch((error) => {
    console.error(error);
  });
  return retrievedCities;
}

async function logout(){
  signOut(auth);
}


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      Citylist:["Austin", "Dallas", "Houston"],
      currActive: "Austin",
      Timelist:[],
      Templist:[],
      isLoggedin: false,
    };
  }

  onChangeValue = event => {
    this.setState({value: event.target.value});
  }

  onChangeUser = event => {
    this.setState({user: event.target.value});
  }

  onChangePass = event => {
    this.setState({pass: event.target.value});
  }

  onAddButton = () => {
    if(this.state.isLoggedin){
      saveCity([...this.state.Citylist, this.state.value], this.state.displayName.toLowerCase());
    }
    this.setState(state => {
      const Citylist = [...state.Citylist, state.value];
      return {
        Citylist,
        value: ''
      };
    });
  };

  onLoginButton = () => {
    // console.log("clicked login button\n");
    const authUser = emailLogin(this.state.user, this.state.pass);
    const displayUser = this.state.user;
    let retrievedCities;
    getCities(displayUser.toLowerCase()).then(snapshot =>{
      retrievedCities = snapshot;
      this.setState(state => {
        return {
          Citylist: retrievedCities,
          auth: authUser,
          displayName: displayUser,
          user: '',
          pass: '',
          isLoggedin: true
        };
      });
    });
    
    
    
  };

  onLogoutButton = () => {
    logout();
    this.setState(state => {
      return {
      Citylist:["Austin", "Dallas", "Houston"],
      auth: null,
      displayName: '',
      user: '',
      pass: '',
      isLoggedin: false
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
    const loginStatus = this.state.isLoggedin;
    let loginSection;
    if(loginStatus){
      loginSection = <div className='login-section'>
        <s className='display-name'>{this.state.displayName}</s>
        <button className='login-button' onClick={this.onLogoutButton}>
          logout
        </button>

      </div>;
    }
    else{
      loginSection = <div className='login-section'>
        <input className='auth-input' type={"text"}
          value={this.state.user}
          onChange={this.onChangeUser}
          placeholder='Enter username'/>

        <input className='auth-input' type={"password"}
          value={this.state.pass}
          onChange={this.onChangePass}
          placeholder='Enter password'/>

        <button className='login-button' onClick={this.onLoginButton}>
          login
        </button>

      </div>;
    }

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

        {loginSection}
        
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

