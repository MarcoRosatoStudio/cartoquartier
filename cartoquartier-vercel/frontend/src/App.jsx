import React from 'react'
import MapView from './MapView'

export default function App(){
  return (
    <div className="app-root">
      <header className="topbar">CartoQuartier — PRU Les Aubiers (demo)</header>
      <main className="main">
        <MapView />
      </main>
    </div>
  )
}
