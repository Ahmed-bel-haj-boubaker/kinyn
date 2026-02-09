import NavbarSideBar from "./component/NavbarSideBar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NavbarSideBar>{children}</NavbarSideBar>;
}
