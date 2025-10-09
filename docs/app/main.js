import React from 'https://esm.sh/react@18.3.1'
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client?deps=react@18.3.1'
import App from './App.js'

const container = document.getElementById('root')
if (!container) {
  throw new Error('Missing root container')
}

createRoot(container).render(React.createElement(App))
