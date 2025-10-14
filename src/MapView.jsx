import React, {useEffect, useState} from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
const [data, setData] = useState(null);

useEffect(() => {
  fetch('/data/sectors.geojson')
    .then(res => res.json())
    .then(json => setData(json))
    .catch(() => setData({ type: 'FeatureCollection', features: [] }));
}, []);

import axios from 'axios'

function FitToBounds({geojson}){
  const map = useMap()
  useEffect(()=>{
    if(!geojson) return
    try{
      const coords = geojson.features.flatMap(f=>f.geometry.coordinates[0].map(c=>[c[1],c[0]]))
      if(coords.length) map.fitBounds(coords)
    }catch(e){}
  },[geojson, map])
  return null
}

export default function MapView(){
  const [data, setData] = useState(()=>{
    // demo mode: localStorage if available, else bundled sample
    const saved = localStorage.getItem('cq_sectors')
    return saved ? JSON.parse(saved) : sample
  })
  const [selected, setSelected] = useState(null)
  const [phaseFilter, setPhaseFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState('all')
  const [play, setPlay] = useState(false)
  const phases = ['phase 1','phase 2','phase 3']

  useEffect(()=>{ localStorage.setItem('cq_sectors', JSON.stringify(data)) },[data])

  useEffect(()=>{
    let t
    if(play){
      t = setInterval(()=> {
        setPhaseFilter(prev=>{
          const i = phases.indexOf(prev)
          const next = i===-1 ? phases[0] : phases[(i+1)%phases.length]
          return next
        })
      }, 1200)
    }
    return ()=> clearInterval(t)
  },[play])

  function onEachFeature(feature, layer){
    layer.on({
      mouseover: (e)=> {
        const layer = e.target
        layer.setStyle({weight:3})
      },
      mouseout: (e)=> {
        const layer = e.target
        layer.setStyle({weight:2})
      },
      click: ()=> setSelected(feature)
    })
    layer.bindTooltip(feature.properties.name || 'secteur')
  }

  function styleFeature(feature){
    const phase = feature.properties.phase || ''
    const status = feature.properties.status || 'libre'
    let color = '#999'
    if(status==='occupé') color = '#d62828'
    else if(status==='réservé') color = '#f77f00'
    else color = phase==='phase 1' ? '#1f77b4' : phase==='phase 2' ? '#2ca02c' : '#ff7f0e'
    let opacity = 0.6
    if(phaseFilter !== 'all' && feature.properties.phase !== phaseFilter) opacity = 0.15
    if(levelFilter !== 'all' && String(feature.properties.level) !== String(levelFilter)) opacity = 0.15
    return { color, weight:2, fillOpacity: opacity }
  }

  function saveEdits(updatedProps){
    const newData = {...data}
    newData.features = data.features.map(f=> f.properties.id===updatedProps.id ? {...f, properties:{...f.properties,...updatedProps}} : f)
    setData(newData)
    // Try to call serverless save (if deployed with SUPABASE mode)
    axios.post('/api/save', {featureId: updatedProps.id, properties: updatedProps}).catch(()=>{})
    setSelected(null)
  }

  const filtered = { ...data, features: data.features.filter(f=> {
    if(phaseFilter!=='all' && f.properties.phase!==phaseFilter) return false
    if(levelFilter!=='all' && String(f.properties.level)!==String(levelFilter)) return false
    return true
  }) }

  return (
    <div style={{display:'flex',width:'100%'}}>
      <MapContainer center={[44.87363, -0.5726]} zoom={15} style={{height:'100%'}}>
        <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
        <GeoJSON data={filtered} onEachFeature={onEachFeature} style={styleFeature} />
        <FitToBounds geojson={filtered} />
      </MapContainer>

      <div className='side-panel'>
        <div className='controls'>
          <div className='field'>
            <label>Phases (filtre)</label>
            <select value={phaseFilter} onChange={e=>setPhaseFilter(e.target.value)}>
              <option value='all'>Tous</option>
              {phases.map(p=> <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className='field'>
            <label>Niveau (level)</label>
            <select value={levelFilter} onChange={e=>setLevelFilter(e.target.value)}>
              <option value='all'>Tous</option>
              <option value='-1'>R-1</option>
              <option value='0'>RDC</option>
              <option value='1'>R+1</option>
              <option value='2'>R+2</option>
            </select>
          </div>

          <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
            <button className='btn' onClick={()=>setPlay(!play)}>{play? 'Stop' : 'Play'}</button>
            <div className='small' style={{marginLeft:8}}>Lecture phases</div>
          </div>

          {selected ? (
            <Editor feature={selected} onSave={saveEdits} onCancel={()=>setSelected(null)} />
          ) : (
            <div>Cliquer sur un secteur / local pour voir / éditer ses informations.</div>
          )}

          <div className='legend'>
            <strong>Légende</strong>
            <div className='small'>Couleurs par phase/status — opacité masquée si hors filtre</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Editor({feature, onSave, onCancel}){
  const [form, setForm] = useState({...feature.properties})
  return (
    <div>
      <h3>Éditer : {form.name}</h3>
      <div className='field'><label>Nom</label><input value={form.name||''} onChange={e=>setForm({...form, name:e.target.value})} /></div>
      <div className='field'><label>Type</label><input value={form.type||''} onChange={e=>setForm({...form, type:e.target.value})} /></div>
      <div className='field'><label>Phase</label>
        <select value={form.phase||''} onChange={e=>setForm({...form, phase:e.target.value})}>
          <option value='phase 1'>Phase 1</option>
          <option value='phase 2'>Phase 2</option>
          <option value='phase 3'>Phase 3</option>
        </select>
      </div>
      <div className='field'><label>Statut</label>
        <select value={form.status||'libre'} onChange={e=>setForm({...form, status:e.target.value})}>
          <option value='libre'>Libre</option>
          <option value='occupé'>Occupé</option>
          <option value='réservé'>Réservé</option>
        </select>
      </div>
      <div className='field'><label>Niveau</label><input value={form.level||0} onChange={e=>setForm({...form, level: parseInt(e.target.value||0)})} /></div>
      <div className='field'><label>Description</label><textarea value={form.description||''} onChange={e=>setForm({...form, description:e.target.value})} /></div>
      <div style={{display:'flex',gap:8}}>
        <button className='btn' onClick={()=>onSave(form)}>Save</button>
        <button className='btn' style={{background:'#666'}} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
