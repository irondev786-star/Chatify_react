import { BrowserRouter, Routes, Route} from "react-router-dom";
import Auth from "./components/jss/signIn";
import HomePage from "./components/jss/home"
import ImagePicker from "./components/jss/Dp";

function App() {
  return (
    <div className="App">
       <BrowserRouter>
          <Routes>
            <Route path="/" element={<Auth/>}/>
            <Route path="/Home" element={<HomePage key={7}/>}/>
             <Route path="/ChangPic" element={<ImagePicker />}/>
           
          </Routes>
       </BrowserRouter>
    </div>
  );
}

export default App;
