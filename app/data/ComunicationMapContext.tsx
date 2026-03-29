import { ComunicationData, DataLoader, DataManager } from "@/data/datamanager";
import { createContext, useContext, useEffect, useState } from "react";
import { useClassData } from "./ClassContext";

const ComunicationDataContext = createContext<any>(null);

export function ComunicationDataProvider({ children }: { children: React.ReactNode }) {
    const classData = useClassData();
    const [comunicationMap, setComunicationMap] = useState(({} as {[key: string]: ComunicationData}));
    const [comunicationIds, setComunicationIds] = useState<string[]>([]);
    const [reloadToken, setReloadToken] = useState(0);

    useEffect(()=>{
        setComunicationIds([...classData.data.comunications]);
    }, [classData.data]);

    let comunications = (Object.values(comunicationMap) as ComunicationData[])
    .filter((cmn: ComunicationData) => typeof cmn === "object" && cmn);

    let unloadedComunications = (comunicationIds as string[])
    .filter((cmn: any) => typeof comunicationMap[cmn] === "undefined");

    const reload = () => {
        setComunicationMap({});
        setReloadToken(prev => prev + 1);
    }

    return (
        <ComunicationDataContext.Provider value={{comunications, comunicationMap, unloadedComunications, reload, loading: unloadedComunications.length > 0}}>
            {comunicationIds.map((id: string) => {
                return (
                    <DataLoader
                        key={`${id}-${reloadToken}`}
                        id={id}
                        keys={DataManager.comunicationData}
                        body={{ comunicationid: id }}
                        onLoad={(id, comunicationdata) =>
                            setComunicationMap(prev => {
                                if (prev[id]?._id === comunicationdata.data?._id) {
                                    return prev;
                                }
                                return {
                                    ...prev,
                                    [id]: comunicationdata.data
                                };
                            })
                        }
                    />
                )
            })}
            {children}
        </ComunicationDataContext.Provider>
    );
}

export function useComunicationData() {
    const context = useContext(ComunicationDataContext);

    if (!context) {
        throw new Error("useComunicationData must be used inside ComunicationDataProvider");
    }

    return context;
}