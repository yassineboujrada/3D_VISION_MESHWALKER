import '../../assets/css/login.css'
import { useNavigate, Link } from "react-router-dom";
import React,{useState} from 'react';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { registerRoute } from "../../utils/ApiRoutes";

export default function Register() {
    const toastOptions = {
        position: "top-right",
        autoClose: 8000,  
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
    };

    const [values, setValues] = useState({ username: "", password: "", repassword:"" });
    const navigate = useNavigate();

    const handleChange = (event) => {
        setValues({ ...values, [event.target.name]: event.target.value });
      };
    
      const validateForm = () => {
        const { username, password,repassword } = values;
        if (username === "") {
          toast.error("Email et le mot de passe sont requis", toastOptions);
          return false;
        } else if (password === "") {
          toast.error("Mot de passe requis", toastOptions);
          return false;
        }else if (repassword === "") {
            toast.error("Mot de passe requis", toastOptions);
            return false;
        }else if (password !== repassword) {
            toast.error("Mot de passe non identique", toastOptions);
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
              registerRoute,
              {
                email: username,
                password:password,
              }
            );
            
            if (data.status === 200) {
              navigate("/login");
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
        <div className="container-panel-geenral">
            <div className="container-login-panel">
                <div className="logo-panel-header">
                    <div>Créer <span style={{"color":"#ff9800"}}>un</span> compte</div>
                </div>
                <div className="form-container-login">
                    <form onSubmit={(event) => handleSubmit(event)}>
                        <input type='email' placeholder="Votre email ...." name="username" onChange={(e) => handleChange(e)}/><br/>
                        <input type='password' placeholder="Votre mot de passe ...." name="password" onChange={(e) => handleChange(e)}/><br/>
                        <input type='password' placeholder="Confirmer mot de passe ...." name="repassword" onChange={(e) => handleChange(e)}/><br/>
                        <button type='submit'>Enregistrer</button><br /><br/>
                        <div className="signup-message-panel">
                        Si vous avez pas déjà un compte <Link id='link' to={'/login'}><span className="span_mssg">Connexion</span></Link>
                        </div>
                    </form>
                </div>
                <ToastContainer />
            </div>
        </div>
    )
}