import React from 'react';
import codemirror from '../../node_modules/codemirror'

class App extends React.Component {
   render() {
      var href = "";

      return (
         <div>
            <h1>Welcome to my project</h1>
            <h2>Name: Gia Do</h2>
            <h2>GWID: 31096692</h2>
            <p>This is a realtime document collaboration app</p>
            <table style={{
               width: "100%"
            }} >
               <thead>
                  <tr >
                     <td>User Type </td>
                     <td>Sender</td>
                     <td>Receiver</td>
                  </tr>
               </thead>
               <tbody>
                  <tr >
                     <td>How to start </td>
                     <td >
                        <button onClick={() => window.open("https://google.com", '_blank')}>Sender</button>
                     </td>
                     <td>
                        <a href={href} target="_blank">Receiver</a>
                     </td>
                  </tr>
               </tbody>
            </table>
         </div >
      );
   }
}
export default App;