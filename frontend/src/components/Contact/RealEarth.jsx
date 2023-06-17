import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import bump from '../../assets/textures/earthbump.jpg';
import earth from '../../assets/textures/earthmap1k.jpg';
import cloud from '../../assets/textures/earthCloud.png';
import galaxy from '../../assets/textures/galaxy.png';


const RealEarth = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    // Three.js code
    const main = () => {
      const canvas = canvasRef.current;

      let scene, camera, renderer;

      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(
        60,
        50 / 50,
        0.1,
        100
      );
      camera.position.z = 2;
      scene.add(camera);

      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
      });
      renderer.setSize(400, 430);
      renderer.setPixelRatio(window.devicePixelRatio);

      renderer.autoClear = false;
      renderer.setClearColor(0x00000, 0.0);

      // create earthgeometry
      const earthgeometry = new THREE.SphereGeometry(0.6, 32, 32);

      const eatrhmaterial = new THREE.MeshPhongMaterial({
        roughness: 1,
        metalness: 0,
        map: new THREE.TextureLoader().load(earth),
        bumpMap: new THREE.TextureLoader().load(bump),
        bumpScale: 0.3,
      });

      const earthmesh = new THREE.Mesh(earthgeometry, eatrhmaterial);

      scene.add(earthmesh);

      // set ambientlight
      const ambientlight = new THREE.AmbientLight(0xffffff, 0.2);
      scene.add(ambientlight);

      // set point light
      const pointerlight = new THREE.PointLight(0xffffff, 0.9);

      // set light position
      pointerlight.position.set(5, 3, 5);
      scene.add(pointerlight);

      // cloud
      const cloudgeometry = new THREE.SphereGeometry(0.63, 32, 32);

      const cloudmaterial = new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load(cloud),
        transparent: true,
      });

      const cloudmesh = new THREE.Mesh(cloudgeometry, cloudmaterial);

      scene.add(cloudmesh);

      // star
      const stargeometry = new THREE.SphereGeometry(80, 64, 64);

      const starmaterial = new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load(galaxy),
        side: THREE.BackSide,
      });

      const starmesh = new THREE.Mesh(stargeometry, starmaterial);

      scene.add(starmesh);

      const animate = () => {
        requestAnimationFrame(animate);
        earthmesh.rotation.y -= 0.0015;
        cloudmesh.rotation.y += 0.0015;
        starmesh.rotation.y += 0.0005;

        render();
      };

      const render = () => {
        renderer.render(scene, camera);
      };

      animate();
    };

    main();
  }, []);

  return <canvas ref={canvasRef} camera={{ position: [5, 5, 5], fov: 25 }} id="c" />;
};

export default RealEarth;
