import React from 'react'
import {useNavigate, Link} from "react-router-dom"
import { useState } from 'react'
import { useAuth } from "../hooks/useAuth"

const Register = () => {
    const {loading, handleRegister} = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
  
    const handleSubmit = async (e) => {
        e.preventDefault();
        await handleRegister(username, email, password);
        navigate("/");
    }

    if(loading) {
        return (
            <main>
                <h1>Loading....</h1>
            </main>
        )
    }
    
  return (
        <main>
        <div className="form_container">
            <h1>Register</h1>

            <form >
                <div className="input_group">
                    <label htmlFor="username">Username</label>
                    <input 
                        type="username" id="username" name="username" placeholder='Enter username' 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>

                <div className="input_group">
                    <label htmlFor="email">Email</label>
                    <input 
                        type="email" id="email" name="email" placeholder='Enter Email Address' 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="input_group">
                    <label htmlFor="password">Password</label>
                    <input 
                        type="password" id="password" name="password" placeholder='Enter password' 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <button className="button primary_btn"
                    onClick={handleSubmit}
                > Register </button>

                <p>Already have account? <Link to={"/login"}>Login</Link></p>

            </form>
        </div>
    </main>
  )
}

export default Register