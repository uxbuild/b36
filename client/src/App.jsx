import { useState, useEffect } from "react";

//error component
const ErrorMessage = ({ errorText }) => {
  return <div className="error-msg">{errorText}</div>;
};

//login component
const Login = ({ login, register, errorText, clearError }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const submit = (ev) => {
    ev.preventDefault();
    clearError();
    login({ username, password });
  };

  // register
  const onRegister = async (e) => {
    e.preventDefault();
    clearError();
    console.log("register clicked");
    register({ username, password });
  };

  return (
    <form onSubmit={submit}>
      <input
        value={username}
        placeholder="username"
        onChange={(ev) => {
          setUsername(ev.target.value);
          errorText && clearError();
        }}
      />
      <input
        value={password}
        placeholder="password"
        onChange={(ev) => setPassword(ev.target.value)}
      />
      <button disabled={!username || !password}>Login</button>
      <button disabled={!username || !password} onClick={onRegister}>
        Register
      </button>
    </form>
  );
};

function App() {
  const [auth, setAuth] = useState({});
  const [products, setProducts] = useState([]);
  const [favorites, setFavorites] = useState([]);

  const [isError, setIsError] = useState(false);
  const [errorText, setErrorText] = useState(null);

  const clearError = () => {
    setErrorText(null);
  };
  const setError = (msg) => {
    setErrorText(msg);
  };

  useEffect(() => {
    attemptLoginWithToken();
  }, []);

  //logwithtoken
  const attemptLoginWithToken = async () => {
    const token = window.localStorage.getItem("token");
    console.log("ATTEMPT LOGIN W TOKEN", token);

    if (token) {
      const response = await fetch(`/api/auth/me`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const json = await response.json();
      console.log("Init app. Logged in with TOKEN", json);

      if (response.ok) {
        console.log("setAuth", json);
        setAuth(json);
      } else {
        window.localStorage.removeItem("token");
      }
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      const response = await fetch("/api/products");
      const json = await response.json();
      setProducts(json);
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    // console.log('use effect..');
    const fetchFavorites = async () => {
      console.log(`fetching favorites (${auth.id})..`);
      const response = await fetch(`/api/users/${auth.id}/favorites`, {
        //REVIEW
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem("token")}`,
        },
      });
      const json = await response.json();
      if (response.ok) {
        console.log("response json", json);
        setFavorites(json);
      } else {
        setError(json.message);
      }
    };
    if (auth.id) {
      console.log(`auth.id (${auth.id}) fetchFavorites()`);
      fetchFavorites();
    } else {
      setFavorites([]);
    }
  }, [auth]);

  // LOGIN
  const login = async (credentials) => {
    console.log("LOGIN component click: ", credentials);
    // const token = window.localStorage.getItem('token');
    try {
      console.log("LOGIN component TRY");

      console.log("login try fetch /api/auth/login");

      const response = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const json = await response.json();
      if (response.ok) {
        console.log("LOGIN response OK");
        clearError();
        window.localStorage.setItem("token", json.token);
        attemptLoginWithToken();
      } else {
        console.log("LOGIN response not-OK");
        console.log(json);
        setError("Username or password is incorrect.");
      }
    } catch (error) {
      console.log("LOGIN catch error");
      setError(error.message);
    }
  };

  //register
  const register = async (credentials) => {
    console.log("LOGIN register user click: ", credentials);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(credentials),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const json = await response.json();
    if (response.ok) {
      clearError();
      console.log("user registered", json); // test.
    } else {
      console.log(json);
      setError(json.message);
    }
  };

  // ADDFAV
  const addFavorite = async (product_id) => {
    console.log("************");
    console.log("ADD FAVORITE auth.id", auth.id);
    const token = window.localStorage.getItem("token");
    console.log("get token", token);
    console.log("product-id", product_id);

    const response = await fetch(`/api/users/${auth.id}/favorites`, {
      method: "POST",
      body: JSON.stringify({ product_id }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await response.json();

    console.log("response json", json);

    if (response.ok) {
      clearError();
      setFavorites([...favorites, json]);
      console.log("favorites (ADD)", favorites);
    } else {
      console.log(json);
      setError(json.message);
    }
  };

  const removeFavorite = async (id) => {
    console.log("CLICK REMOVE FAVORITE", id);
    const token = window.localStorage.getItem("token");
    const response = await fetch(`/api/users/${auth.id}/favorites/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      clearError();
      setFavorites(favorites.filter((favorite) => favorite.id !== id));
    } else {
      console.log(response);
      const json = response.json();
      setError(json.message);
    }
  };

  const logout = () => {
    window.localStorage.removeItem("token");
    clearError();
    setAuth({});
  };

  return (
    <>
      {!auth.id ? (
        <Login
          login={login}
          register={register}
          errorText={errorText}
          setErrorText={setErrorText}
          clearError={clearError}
          //login, register, errorText, clearError
        />
      ) : (
        <button onClick={logout}>Logout {auth.username}</button>
      )}
      <p>{errorText && <ErrorMessage errorText={errorText} />}</p>

      <ul>
        {products.map((product) => {
          const isFavorite = favorites.find(
            (favorite) => favorite.product_id === product.id
          );
          return (
            <li key={product.id} className={isFavorite ? "favorite" : ""}>
              {product.name}
              {auth.id && isFavorite && (
                <button onClick={() => removeFavorite(isFavorite.id)}>-</button>
              )}
              {auth.id && !isFavorite && (
                <button onClick={() => addFavorite(product.id)}>+</button>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default App;
