import { AnimatePresence, motion } from "framer-motion"

interface Props {
    isOpen: boolean,
    children: React.ReactNode
}

function AnimateHeight({ isOpen, children }: Props) {
    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.div
                    initial={{
                        height: 0,
                        opacity: 0,
                    }}
                    animate={{
                        height: "auto",
                        opacity: 1,
                        transition: {
                            height: {
                                duration: 0.4,
                            },
                            opacity: {
                                duration: 0.25,
                                delay: 0.15,
                            },
                        },
                    }}
                    exit={{
                        height: 0,
                        opacity: 0,
                        transition: {
                            height: {
                                duration: 0.4,
                            },
                            opacity: {
                                duration: 0.25,
                            },
                        },
                    }}
                    key="test"
                    className="text-lg font-light w-full"
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default AnimateHeight