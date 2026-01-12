/// <reference types="nativewind/types" />

import "react";

declare module "react" {
    interface Attributes {
        className?: string;
        tw?: string;
    }
}
