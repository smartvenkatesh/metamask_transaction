import React from 'react'
import { Navbar,Welcome,Footer,Transactions, Loader } from './components'

const App = () => {
  return (
    <div className='min-h-screen'>
     <div className='gradient-bg-welcome'>
      <Navbar/>
      <Welcome/>
      <Loader/>
     </div>
     
     {/* <Services/>
     <Transactions/>
     <Footer/> */}
    </div>
  )
}

export default App