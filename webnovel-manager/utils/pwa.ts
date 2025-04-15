// Register service worker for PWA functionality
export function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/service-worker.js").then(
        (registration) => {
          console.log("Service Worker registration successful with scope: ", registration.scope)
        },
        (err) => {
          console.log("Service Worker registration failed: ", err)
        },
      )
    })
  }
}

// Check if the app is installed or can be installed
export function useAppInstallation() {
  if (typeof window === "undefined") {
    return { canInstall: false, isInstalled: false, promptInstall: () => {} }
  }

  // Check if the app is already installed
  const isInstalled = window.matchMedia("(display-mode: standalone)").matches

  // Store the installation prompt event
  let deferredPrompt: any = null

  // Listen for the beforeinstallprompt event
  window.addEventListener("beforeinstallprompt", (e) => {
    // Prevent the default browser prompt
    e.preventDefault()
    // Store the event for later use
    deferredPrompt = e
  })

  // Function to prompt the user to install the app
  const promptInstall = () => {
    if (deferredPrompt) {
      // Show the installation prompt
      deferredPrompt.prompt()
      // Wait for the user to respond
      deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the install prompt")
        } else {
          console.log("User dismissed the install prompt")
        }
        // Clear the deferred prompt
        deferredPrompt = null
      })
    }
  }

  return {
    canInstall: !!deferredPrompt,
    isInstalled,
    promptInstall,
  }
}
