import React,{useRef,useState} from 'react'
import '../../assets/css/setting.css'
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { settingRoute } from "../../utils/ApiRoutes";

export default function Setting () {
    const form = useRef();
    const [values, setValues] = useState({password: "", confpassword:"" });

    const toastOptions = {
        position: "top-right",
        autoClose: 8000,  
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
    };

    const navigate = useNavigate();

    const handleChange = (event) => {
        setValues({ ...values, [event.target.name]: event.target.value });
      };
    
    const validateForm = () => {
        const { password,confpassword } = values;
        console.log(values);
        if (password === "") {
            toast.error("Mot de passe requis", toastOptions);
            return false;
        }else if (confpassword === "") {
            toast.error("Mot de passe requis", toastOptions);
            return false;
        }else if (password !== confpassword) {
            toast.error("Mot de passe non identique", toastOptions);
            return false;
        }
        return true;
    };
    
      const handleSubmit = async (event) => {
        event.preventDefault();
        if (validateForm()) {
          try {
            const { password } = values;
            const  {data}  = await axios.post(
              settingRoute,
              {
                email : localStorage.getItem("email"),
                password:password,
              }
            );
            
            if (data.status === 200) {
              navigate("/setting");
            }
            else{
              toast.error("Il y a une erreur, veuillez vérifier vos informations", toastOptions);
            }
            }catch (error) {
              toast.error("Quelque chose ne va pas", toastOptions);
          }
        }
      };
    
    return (
        <>
            <main>
                <div className="aboutus-holder"><br />
                    <h1>Paramètre :</h1><br /><br />
                    <div className='setting-holder'>
                        <div className='setting-bio'>
                            <h2>
                            Profil :
                            </h2>
                            <p>Cette information sera secrète</p>
                        </div><br /><br />
                        <div className='setting-form'>
                            <form ref={form} onSubmit={(event) => handleSubmit(event)}>
                                <div className="form-inf">
                                    <label htmlFor="email">Email :</label><br />
                                    <label htmlFor="email2">{localStorage.getItem("email")}</label>
                                </div>
                                <div className="form-inf">
                                    <label htmlFor="password">Mot de passe :</label><br />
                                    <input type="password" className="form-input" placeholder="Votre mot de passe" name="password" onChange={(e) => handleChange(e)} />
                                </div>
                                <div className="form-inf">
                                    <label htmlFor="password">Confirmer mot de passe :</label><br />
                                    <input type="password" className="form-input" placeholder="Confirmer votre mot de passe" name="confpassword" onChange={(e) => handleChange(e)} />
                                </div>
                                <button type="submit" className="btn-sub">Enregistrer</button>
                            </form>
                        </div>
                    </div>
                </div>
                <ToastContainer />
            </main>
        </>
    )
}