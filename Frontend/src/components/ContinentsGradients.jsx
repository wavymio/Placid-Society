import React from 'react'

const ContinentsGradients = () => {
    return (
        <defs>
            <linearGradient id="oceaniaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#e0f7fa" />         {/* Ice */}
                <stop offset="3%" stopColor="#e0f7fa" />       
                <stop offset="15%" stopColor="#7cdacc" /> 

                <stop offset="35%" stopColor="#0077BE" />         {/* Water */}
                         {/* Water */}
                
                <stop offset="50%" stopColor="#5d6f34" />         {/* Greens */}
                <stop offset="70%" stopColor="#5d6f34" />
                
                <stop offset="90%" stopColor="#eab676" />         {/* Desert */}
             
                <stop offset="100%" stopColor="#5d6f34" />        {/* Green again */}
            </linearGradient>

            <linearGradient id="eldoriaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="5%" stopColor="#D3D3D3" />  {/* Earthy Brown */}
                <stop offset="20%" stopColor="#D3D3D3" />  {/* Earthy Brown */}
                <stop offset="60%" stopColor="#A9A9A9" />  {/* Dark Gray (Rocky) */}
                {/* <stop offset="70%" stopColor="#D3D3D3" />  Light Gray (Higher Altitudes) */}
                <stop offset="90%" stopColor="#E5C07B" />
                <stop offset="98%" stopColor="#006400" />
            </linearGradient>

            <linearGradient id="vastaraGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    {/* Dark Gray (Rocky) */}
                <stop offset="10%" stopColor="#D3D3D3" />  {/* Light Gray (Higher Altitudes) */}
                <stop offset="30%" stopColor="#A9A9A9" />
                <stop offset="40%" stopColor="#E5C07B" />
                <stop offset="70%" stopColor="#E5C07B" />  {/* Earthy Brown */}
                <stop offset="90%" stopColor="#006400" />
            </linearGradient>

            <linearGradient id="zentaraGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="10%" stopColor="#E5C07B" />  {/* Gold */}
                <stop offset="50%" stopColor="#A68A64" />  {/* Brown */}
                <stop offset="90%" stopColor="#006400" />  {/* Dark Green */}
            </linearGradient>

            <linearGradient id="mythosGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="10%" stopColor="#006400" />  {/* Purple */}
                <stop offset="50%" stopColor="#E5C07B" />  {/* Indigo */}
                <stop offset="90%" stopColor="#0A2E36" />  {/* Blue */}
            </linearGradient>

            <linearGradient id="titanisGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="10%" stopColor="#D2B48C" />  {/* Sea Green */}
                <stop offset="40%" stopColor="#2E8B57" />  {/* Lime Green */}
                <stop offset="70%" stopColor="#006400" />  {/* Dark Green */}
                <stop offset="90%" stopColor="#0077BE" />  {/* Dodger Blue (Water) */}
            </linearGradient>

            <linearGradient id="lunariaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="1%" stopColor="#D3D3D3" />  {/* Turquoise */}
                <stop offset="5%" stopColor="#D3D3D3" />  {/* Turquoise */}
                <stop offset="30%" stopColor="#A9A9A9" />  {/* Light Gray (Higher Altitudes) */}
                <stop offset="40%" stopColor="#A9A9A9" />
                <stop offset="50%" stopColor="#A9A9A9" />  {/* Light Blue */}
                <stop offset="80%" stopColor="#D3D3D3" />  {/* White */}
            </linearGradient>
        </defs>
    )
}

export default ContinentsGradients
