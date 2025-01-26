import { useState, useEffect } from "react";

//error component
const ErrorMessage = ({ errorText }) => {
  return <div className="error-msg">{errorText}</div>;
};

//login component
const Login = ({ login, register }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const submit = (ev) => {
    ev.preventDefault();
    login({ username, password });
  };

  // register
  const onRegister = async (e) => {
    e.preventDefault();
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
          isError && setIsError(false);
          isError && setErrorText("");
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
  const [errorText, setErrorText] = useState("");

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
    const response = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const json = await response.json();
    if (response.ok) {
      window.localStorage.setItem("token", json.token);
      attemptLoginWithToken();
    } else {
      console.log(json);
      setIsError(true);
      setErrorText("Username or password is incorrect.");
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
      console.log("user registered", json); // test.
    } else {
      console.log(json);
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
      setFavorites([...favorites, json]);
      console.log("favorites (ADD)", favorites);
    } else {
      console.log(json);
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
      setFavorites(favorites.filter((favorite) => favorite.id !== id));
    } else {
      console.log(response);
    }
  };

  const logout = () => {
    window.localStorage.removeItem("token");
    setAuth({});
  };

  return (
    <>
      {!auth.id ? (
        <Login login={login} register={register} isError={isError} setIsError={setIsError} errorText={errorText} setErrorText={setErrorText} />
      ) : (
        <button onClick={logout}>Logout {auth.username}</button>
      )}
      <p>{isError && <ErrorMessage errorText={errorText} />}</p>

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
