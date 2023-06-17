import { useNavigate, Link } from "react-router-dom";
import React,{useState} from 'react';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { loginRoute } from "../../utils/ApiRoutes";

export default function LoginBody() {
    
    const toastOptions = {
        position: "top-right",
        autoClose: 8000,  
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
    };

    const [values, setValues] = useState({ username: "", password: "" });
    const navigate = useNavigate();

    const handleChange = (event) => {
        setValues({ ...values, [event.target.name]: event.target.value });
      };
    
      const validateForm = () => {
        const { username, password } = values;
        if (username === "") {
          toast.error("Email et le mot de passe sont requis", toastOptions);
          return false;
        } else if (password === "") {
          toast.error("Mot de passe requis", toastOptions);
          return false;
        }
        return true;
      };
    
      const handleSubmit = async (event) => {
        event.preventDefault();
        if (validateForm()) {
          try {
            const { username, password } = values;
            console.log(values);
            const  {data}  = await axios.post(
              loginRoute,
              {
                email: username,
                password:password,
              }
            );
            console.log(data);
            
            if (data.status === 200) {
              localStorage.setItem(
                "Auth",
                JSON.stringify(data.token)
              );
              localStorage.setItem(
                "email",
                JSON.stringify(data.data)
              );
              navigate("/home");
            }
            else{
              toast.error("Il y a une erreur, veuillez vérifier vos informations", toastOptions);
            }
            }catch (error) {
              toast.error("Quelque chose ne va pas", toastOptions);
          }
        }
      };


    return(
        <div>
            <div className="form-container-login">
                <form onSubmit={(event) => handleSubmit(event)}>
                    <input type='email' placeholder="Votre email ...." name="username" onChange={(e) => handleChange(e)}/><br/>
                    <input type='password' placeholder="Votre mot de passe ...." name="password" onChange={(e) => handleChange(e)}/><br/>
                    <button type='submit'>Connexion</button><br /><br/>
                    <div className="signup-message-panel">
                      Si vous n'avez pas déjà un compte s'il vous plaît <Link id='link' to={'/SignIn'}><span className="span_mssg" >S'identifier</span></Link>
                    </div>
                </form>
            </div>
            <ToastContainer />
        </div>
    )

}