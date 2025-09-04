import React from 'react'

export default function Brand({ compact=false, className='' }){
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img src="/logo.png" alt="SwipeIT" className={`object-contain ${compact ? 'w-8 h-8' : 'w-10 h-10'}`} />
      <div className={`font-semibold text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>SwipeIT</div>
    </div>
  )
}
