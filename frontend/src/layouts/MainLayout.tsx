import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

function MainLayout() {
    return (
        <div className="app-layout">
            <a className="skip-link" href="#conteudo-principal">
                Pular para o conteúdo principal
            </a>

            <Header />

            <main
                id="conteudo-principal"
                tabIndex={-1}
                className="main-contenct"
            >
                <Outlet />

            </main>

            <Footer />

        </div>
    )
}

export default MainLayout