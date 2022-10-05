import React from "react";
import { motion, AnimatePresence, AnimateSharedLayout } from "framer-motion"

type Props = {
    tabs: { body: React.ReactElement }[],
    page: number,
    direction: -1 | 1,
    paginate: (dir: number) => void,
    height?: number
}

const spring = {
    type: "tween",
    // delay: 0,
    // stiffness: 300,
    // damping: 30,
    // duration: 2
}

const variants = {
    enter: (direction: number) => (
        {
            x: direction > 0 ? 500 : -500,
            opacity: 0
        }
    ),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1
    },
    exit: (direction: number) => (
        {
            zIndex: 0,
            x: direction < 0 ? 500 : -500,
            opacity: 0
        }
    )
}

const swipeConfidenceThreshold = 10000

const swipePower = (offset: number, velocity: number) => (
    Math.abs(offset) * velocity
)

export default function Tabs({ tabs, page, direction, paginate, height }: Props) {
    return (
        <div className="relative h-full w-full" style={height ? {height: `${height}px`} : {}}>
            <AnimatePresence initial={false} custom={direction}>

                <motion.section
                    className='absolute h-full w-full'
                    key={page}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={spring}
                    // drag="x"e
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={1}
                    onDragEnd={(e, { offset, velocity }) => {
                        const swipe = swipePower(offset.x, velocity.x);

                        if (swipe < -swipeConfidenceThreshold) {
                            paginate(1);
                        } else if (swipe > swipeConfidenceThreshold) {
                            paginate(-1);
                        }
                    }}
                >
                    <div className='w-full h-full'>
                        {tabs[page].body}
                    </div>
                </motion.section>
            </AnimatePresence>
        </div>
    )
}