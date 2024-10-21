import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

interface ViewOptions {
  showMessages: boolean;
}

const initialState: ViewOptions = {
  showMessages: false,
};

const parseBool = (val: string | null, def: boolean = false): boolean =>
  val === null ? def : val === "true" || val === "1";
const toBool = (val: Boolean): string => (val ? "1" : "");

const toViewOptions = (val: URLSearchParams): ViewOptions => ({
  showMessages: parseBool(val.get("showMessages")),
});

const fromViewOptions = (val: ViewOptions): Record<string, string> =>
  Object.fromEntries(
    Object.entries({
      showMessages: toBool(val.showMessages),
    } as Record<keyof ViewOptions, string>).filter((p) => p[1])
  );

const fixedInitialState = fromViewOptions(initialState);

export const useViewOptions = () => {
  const [params, setParams] = useSearchParams(fixedInitialState);
  const viewOptions = useMemo(() => toViewOptions(params), [params]);
  const setViewOptions = useCallback(
    (update: Partial<ViewOptions>) => {
        const options = {...viewOptions, ...update};
        setParams(fromViewOptions(options));
    },
    [params]
  );
  return [viewOptions, setViewOptions];
};
