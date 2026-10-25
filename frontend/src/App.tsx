import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Services from "./pages/Services";
import Booking from "./pages/Booking";
import Location from "./pages/Location";
import About from "./pages/About";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/services" element={<Services />} />
      <Route path="/book" element={<Booking />} />
      <Route path="/location" element={<Location />} />
      <Route path="/about" element={<About />} />
    </Routes>
  );
}
