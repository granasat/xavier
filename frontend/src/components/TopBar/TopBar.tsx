import { Children } from "react"

interface Props {
    children: React.ReactNode
}

export default function TopBar(props: Props) {
    return (
        <div className="h-11 border-b border-solid border-neutral-600 flex items-center justify-end w-full">
            {props.children}
        </div>
    )
}