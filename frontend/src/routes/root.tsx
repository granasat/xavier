import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export default function Root() {
    return (
      <div className="flex w-screen h-screen">
        <div className="flex-none">
          <Sidebar/>
        </div>
        <div className="grow relative">
          <Outlet/>
        </div>
      </div>
    );
  }