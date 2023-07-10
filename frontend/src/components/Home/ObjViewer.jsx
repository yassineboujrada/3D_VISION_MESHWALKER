import React, { useRef, useState, useEffect} from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

function OBJViewer(props){
    useEffect(()=>{
    const scene = new THREE.Scene();
    //const ambientLight = new THREE.AmbientLight( 0xcccccc, 0.4 );
		//scene.add( ambientLight );

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    const pointLight = new THREE.PointLight( 0xffffff, 0.8 );
		camera.add( pointLight );
		scene.add( camera );

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(500, 500);
    document.getElementById("objViewerDiv").appendChild(renderer.domElement);
    renderer.render(scene, camera);
    console.log('Component mounted!');

  const loader = new OBJLoader();

  loader.load(props.url, function(obj) {
    console.log(obj)
    scene.add(obj);
  });
  function render() {

    window.requestAnimationFrame( render );
    renderer.render( scene, camera );

  }

  render();
  return () => {
    renderer.dispose();
    document.getElementById("objViewerDiv").removeChild(renderer.domElement);
    scene.remove(...scene.children);
  };
}, [props.url]);

}

export default OBJViewer;
