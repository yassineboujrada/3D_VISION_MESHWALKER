// this file is for the obj viewer that will be shown after uploading the file and after the prediction
// the obj viewer is a 3d viewer that will show the file that was uploaded and colorize the edges of the file
import { useLocation } from "react-router-dom";
import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { loadRoute } from "../../utils/ApiRoutes";

function OBJViewer() {
  // this is the file that was uploaded in the previous page with the outputs of the prediction
  const { state } = useLocation();
  const file = state.file;
  const segmentation = state.segmentation;

  // objUrl is the url of the file that was uploaded
  const [objUrl, setObjUrl] = useState(null);

  // showObjViewer is a boolean that indicates if the obj viewer should be shown or not
  const [showObjViewer, setShowObjViewer] = useState(false);

  // segemantationval is the output of the prediction
  const [segemantationval, setSegemantationVal] = useState(null);

  // containerRef is a reference to the div that will contain the obj viewer (the div with id='container')
  const containerRef = useRef(null);
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer();

  // this useEffect is called when the component is mounted for action on the window resize
  useEffect(() => {
    setSegemantationVal(segmentation);
    const handleWindowResize = () => {
      const { current: container } = containerRef;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleWindowResize);

    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);

  // this useEffect is for action on the file that was uploaded and onloading the obj viewer
  useEffect(() => {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function (event) {
      const url = URL.createObjectURL(new Blob([event.target.result], { type: 'text/plain' }));
      setObjUrl(url);
      setShowObjViewer(true);
    };
    reader.readAsText(file);
  }, [file]);

  // this useEffect is for action on the output of the prediction (segemantationval) i mean upload the file and colorize the edges 
  useEffect(() => {
    if (!showObjViewer || !objUrl) return;

    // containerRef is a reference to the div that will contain the obj viewer (the div with id='container')
    const { current: container } = containerRef;

    // renderer is the obj viewer
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 5;

    // configure mouse controls
    const controls = new OrbitControls(camera, renderer.domElement);

    // configure the scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xffffff );
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1).normalize();
    scene.add(light);

    // here where the work start we get the file and we load it and we colorize the edges 
    //the problem is that the edges are defficult to be colored correctly 
    // for that we stock geometry of our object in a variable after that we add the object to the scene and this colors after looping in geometry added to the scene
    const loader = new OBJLoader();
    loader.load(loadRoute+file.name, (object) => {
      let geometry = object.children[0].geometry;  
      scene.add(object);
      if (segemantationval != null){
        let colors_ = [[255,0,0,1],[0,255,0,1],[0,0,255,1],[255,255,0,1],[255,0,255,1],[0,255,255,1],[0,0,0,1],[255,255,255,1]]
        let colorisation = []
        for (let i=0;i<geometry.attributes.position.count/3;i++){
          try{
              let tmp = colors_[segemantationval[i]-1]
              colorisation.push(tmp[0],tmp[1],tmp[2],tmp[3]);
              colorisation.push(tmp[0],tmp[1],tmp[2],tmp[3]);
              colorisation.push(tmp[0],tmp[1],tmp[2],tmp[3]);
          }
          catch {console.log("error",segemantationval[i]-1);}
        }
        const material = new THREE.MeshBasicMaterial({
            vertexColors: true
        });
        geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colorisation, 4 ));
          let mesh = new THREE.Mesh(geometry, material);
          scene.add(mesh);
          animate();
        }

    });

    // animate the scene
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }

    // dispose the scene when the component is unmounted
    return () => {
      renderer.dispose();
      container.removeChild(renderer.domElement);
      scene.remove(...scene.children);
    };
  }, [showObjViewer, objUrl]);

  return <>
      <main>
        <div className="aboutus-holder"><br />
          <h1>file :</h1><br />
          <div ref={containerRef} className='description-holder'/>
        </div>
      </main>
    </>;
}

export default OBJViewer;