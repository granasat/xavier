import { useRouteError } from "react-router-dom";

export default function ErrorPage() {
  const error: any = useRouteError();
  console.error(error);
  
  return (
    <div className="w-screen flex flex-col items-center justify-center">
      <div className="text-6xl font-bold mb-10">Oops!</div>
      {/* <div className="mb-10 text-xl">Sorry, an unexpected error has occurred.</div> */}
      <div className="italic font-light">
        {error.statusText || error.message}
      </div>
    </div>
  );
}