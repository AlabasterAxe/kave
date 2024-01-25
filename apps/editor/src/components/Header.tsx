import { NavLink, useParams, useMatches } from "react-router-dom";

export function Header() {
    const [{params: {id}}] = useMatches();

    return <div className="h-16 w-screen py-2 px-4 items-center flex flex-row border-b">
      <NavLink to="/" className="text-xl font-bold">Kave{id ? ` - ${id}` : ''}</NavLink>
    </div>
}