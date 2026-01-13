/**
 * Scanner Component
 * Displays camera view and scans QR codes from bingo cards
 */

import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import './Scanner.css';

export default function Scanner({ onScan, onError }) {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const lastScanTime = useRef(0);

  useEffect(() => {
    if (!videoRef.current) return;

    let scanner = null;

    const initScanner = async () => {
      try {
        scanner = new QrScanner(
          videoRef.current,
          (result) => handleScan(result.data),
          {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: 'environment', // Rear camera preferred
            maxScansPerSecond: 5, // Limit scan rate
          }
        );

        scannerRef.current = scanner;

        await scanner.start();
        setIsScanning(true);
        setHasPermission(true);

      } catch (err) {
        console.error('Scanner initialization error:', err);
        setHasPermission(false);

        if (err.name === 'NotAllowedError') {
          onError?.(new Error('Camera permission denied. Please allow camera access.'));
        } else if (err.name === 'NotFoundError') {
          onError?.(new Error('No camera found on this device.'));
        } else if (err.name === 'NotReadableError') {
          onError?.(new Error('Camera is already in use by another application.'));
        } else {
          onError?.(err);
        }
      }
    };

    initScanner();

    // Cleanup function
    return () => {
      if (scanner) {
        scanner.stop();
        scanner.destroy();
      }
    };
  }, [onError]);

  const handleScan = (data) => {
    if (!isScanning) return;

    // Debounce scans to prevent rapid duplicates
    const now = Date.now();
    if (now - lastScanTime.current < 1000) {
      return; // Ignore scans within 1 second of last scan
    }
    lastScanTime.current = now;

    // Pause scanning during processing
    setIsScanning(false);
    onScan(data);

    // Resume scanning after 3 seconds
    setTimeout(() => {
      setIsScanning(true);
    }, 3000);
  };

  return (
    <div className="scanner-container">
      <video
        ref={videoRef}
        className="scanner-video"
        playsInline
      />
      <div className="scan-overlay">
        <div className="scan-frame">
          {hasPermission === false && (
            <div className="permission-message">
              <p>Camera access is required</p>
              <p className="small">Please allow camera access in your browser settings</p>
            </div>
          )}
          {hasPermission === true && (
            <p className="scan-instruction">Position QR code within frame</p>
          )}
        </div>
      </div>
      {!isScanning && hasPermission && (
        <div className="scan-paused">
          <div className="spinner" />
        </div>
      )}
    </div>
  );
}
