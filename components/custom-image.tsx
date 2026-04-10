"use client"

import Image from 'next/image'
import  { useState } from 'react'

export default function CustomImage({
    img,
    alt,
    className }: {
        img: string,
        alt: string,
        className: string,
    }) {

    const [isLoading, setIsLoading] = useState(true)
    return (
        <Image src={img} alt={alt} className={className + ` object-contain rounded-2xl duration-700 ease-in-out group-hover:opacity-75 ${isLoading
            ? 'scale-110 blur-2xl grayscale'
            : 'scale-100 blur-0 grayscale-0'
            }`}
            onLoad={() => setIsLoading(false)} width={500} height={500} />

    )
}
