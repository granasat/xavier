import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

export default function Root() {
  const [sideBar, setSideBar] = useState(true)

  return (
    <div className="flex flex-col-reverse sm:flex-row w-screen h-screen">
      {/* <AnimatePresence>
        {sideBar && (
          <>
            <motion.div
              initial={{ x: "-100%" }}
              animate={{
                x: 0
              }}
              exit={{
                x: "100%"
              }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="flex-none xs:rotate-90"
            >
              <Sidebar />

            </motion.div>
          </>)
        }
      </AnimatePresence> */}
      <div
        className="flex-none z-50 bg-neutral-800"
      >
        <Sidebar />

      </div>


      {/* <div className="flex-none">
        </div> */}
      <div className="grow relative z-20">
        <Outlet />
      </div>
    </div>
  );
  return (
    <>Hello</>
  )
}