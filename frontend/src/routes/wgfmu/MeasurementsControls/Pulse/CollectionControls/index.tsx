import { contourDensity } from "d3"
import { LayoutGroup, motion } from "framer-motion"
import AnimateHeight from "../../../../../components/Graph/AnimateHeight"
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks"
import {
  selectParams,
  selectControlsType,
  setParamsField,
} from "./collectionControlsSlice"
import EpscControls from "./EpscControls"
import MultiPulseControls from "./MultiPulseControls"
import PpfControls from "./PpfControls"

export default function () {
  const params = useAppSelector(selectParams)
  const controlsType = useAppSelector(selectControlsType)
  const dispatch = useAppDispatch()

  return (
    <>
      <div className="p-2 w-full border border-solid flex justify-around items-center border-neutral-600 rounded-lg">
        <LayoutGroup>
          <button
            className="font-bold rounded-lg w-full"
            onClick={() =>
              dispatch(
                setParamsField({
                  val: "MultiPulse",
                  key: "collectionType",
                })
              )
            }
          >
            <div className="relative w-full h-full text-center">
              <div className="p-2">Multi Pulse</div>
              {params.collectionType == "MultiPulse" ? (
                <motion.div
                  className="absolute h-full w-full bg-neutral-700 top-0 -z-10 rounded-lg"
                  layoutId="collectionTypeSelector"
                />
              ) : null}
            </div>
          </button>
          <button
            className="font-bold rounded-lg w-full text-start"
            onClick={() =>
              dispatch(
                setParamsField({
                  val: "EPSC",
                  key: "collectionType",
                })
              )
            }
          >
            <div className="relative w-full h-full">
              <div className="p-2">EPSC</div>
              {params.collectionType == "EPSC" ? (
                <motion.div
                  className="absolute h-full w-full bg-neutral-700 top-0 -z-10 rounded-lg"
                  layoutId="collectionTypeSelector"
                />
              ) : null}
            </div>
          </button>
          <button
            className="font-bold rounded-lg h-full w-full text-center"
            onClick={() =>
              dispatch(
                setParamsField({
                  val: "PPF",
                  key: "collectionType",
                })
              )
            }
          >
            <div className="relative w-full h-full">
              <div className="p-2 text-center">PPF</div>
              {params.collectionType == "PPF" ? (
                <motion.div
                  className="absolute h-full w-full bg-neutral-700 top-0 -z-10 rounded-lg"
                  layoutId="collectionTypeSelector"
                />
              ) : null}
            </div>
          </button>
        </LayoutGroup>
      </div>

      <AnimateHeight isOpen={controlsType == "MultiPulse"}>
        <MultiPulseControls />
      </AnimateHeight>

      <AnimateHeight isOpen={controlsType == "EPSC"}>
        <EpscControls />
      </AnimateHeight>

      <AnimateHeight isOpen={controlsType == "PPF"}>
        <PpfControls />
      </AnimateHeight>

    </>
  )
}
